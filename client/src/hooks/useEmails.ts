import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export interface Email {
    id: string;
    recipient: string;
    subject: string;
    body: string;
    status: string;
    scheduled_at: string;
    sent_at: string;
    sender_name?: string;
}

export const useEmails = (view: 'scheduled' | 'sent') => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEmails = useCallback(async () => {
        setLoading(true);
        try {
            const campaignsRes = await api.get('/api/campaigns');
            if (campaignsRes.data.length > 0) {
                const emailPromises = campaignsRes.data.map((campaign: any) =>
                    api.get(`/api/campaigns/${campaign.id}/emails`)
                );

                const emailResponses = await Promise.all(emailPromises);
                let allEmails: Email[] = emailResponses.flatMap(res => res.data);

                if (view === 'sent') {
                    allEmails = allEmails.filter(email => email.status === 'SENT');
                } else {
                    allEmails = allEmails.filter(email =>
                        email.status === 'SCHEDULED' || email.status === 'PENDING'
                    );
                }

                allEmails.sort((a, b) => {
                    const dateA = new Date(a.sent_at || a.scheduled_at || (a as any).created_at);
                    const dateB = new Date(b.sent_at || b.scheduled_at || (b as any).created_at);
                    return dateB.getTime() - dateA.getTime();
                });

                setEmails(allEmails);
            } else {
                setEmails([]);
            }
        } catch (err) {
            console.error('Error fetching emails:', err);
            setEmails([]);
        } finally {
            setLoading(false);
        }
    }, [view]);

    useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);

    return { emails, loading, refresh: fetchEmails };
};
