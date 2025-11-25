"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2, X } from "lucide-react";
import { scanReceiptAction } from "@/app/actions/scan-receipt";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";

interface ReceiptUploaderProps {
    onScanComplete: (data: any) => void;
}

export function ReceiptUploader({ onScanComplete }: ReceiptUploaderProps) {
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsScanning(true);
        try {
            // 1. Upload to Supabase Storage
            const filename = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("receipts")
                .upload(filename, file);

            if (uploadError) {
                console.error("Upload error:", uploadError);
                // Fallback: If upload fails (e.g. bucket doesn't exist), try scanning without saving URL
                // or throw error. Let's try to proceed with scanning but warn.
                // Actually, if we can't upload, we can't save the receipt URL.
                // Let's try to create the bucket if it doesn't exist? No, client can't do that.
                // We'll throw for now, assuming bucket exists as per plan.
                throw new Error("Failed to upload receipt image. Please ensure 'receipts' bucket exists.");
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from("receipts")
                .getPublicUrl(filename);

            // 3. Scan with URL
            const formData = new FormData();
            formData.append("receiptUrl", publicUrl);
            // We also pass the file for the AI to analyze if we want to avoid public URL issues?
            // But the plan was to use the URL.
            // If the bucket is private, publicUrl won't work for OpenAI.
            // Let's pass the file content to the action as well, just in case, 
            // but use the URL for saving.
            // Actually, to be safe against private buckets, let's keep sending the file to OpenAI 
            // via the server action (base64), but ALSO send the receiptUrl so it can be returned/saved.
            formData.append("file", file);
            formData.append("savedReceiptUrl", publicUrl);

            const data = await scanReceiptAction(formData);
            onScanComplete(data);
        } catch (error: any) {
            console.error("Scan failed:", error);
            alert(error.message || "Failed to scan receipt. Please try again.");
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                accept="image/*"
                capture="environment" // Opens camera on mobile
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex items-center rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
                {isScanning ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                    </>
                ) : (
                    <>
                        <Camera className="mr-2 h-4 w-4" />
                        Scan Receipt
                    </>
                )}
            </button>
        </div>
    );
}
