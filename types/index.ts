export interface MonthlyPlan {
    id: string;
    user_id: string;
    month: string;
    expected_income: number;
    created_at: string;
}

export interface Category {
    id: string;
    user_id: string;
    name: string;
    group: 'needs' | 'wants' | 'savings';
    created_at: string;
}

export interface Budget {
    id: string;
    user_id: string;
    name: string;
    category: string;
    amount_limit: number;
    period: string;
    month: string;
    created_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    description: string;
    category: string;
    date: string;
    type: 'income' | 'expense';
    created_at: string;
}
