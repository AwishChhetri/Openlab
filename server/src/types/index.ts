export interface User {
    id: string;
    google_id: string;
    email: string;
    name: string;
    avatar_url: string;
    created_at: Date;
}

export interface Sender {
    id: string;
    user_id: string;
    email: string;
    name: string;
    provider: 'ethereal' | 'gmail';
    credentials: any;
    created_at: Date;
}

export interface Email {
    id: string;
    user_id: string;
    campaign_id?: string;
    sender_id: string;
    recipient: string;
    subject: string;
    body: string;
    status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED';
    scheduled_at: Date | null;
    sent_at: Date | null;
    error_message: string | null;
    retry_count: number;
    created_at: Date;
}

export interface Campaign {
    id: string;
    user_id: string;
    name: string;
    status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'PAUSED';
    created_at: Date;
}
