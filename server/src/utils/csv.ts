import { parse } from 'csv-parse/sync';

/**
 * Parses a CSV buffer and extracts a list of unique email addresses.
 */
export const parseRecipientCsv = (buffer: Buffer): string[] => {
    const records = parse(buffer, {
        columns: false,
        skip_empty_lines: true,
        trim: true
    });

    return Array.from(new Set(
        records
            .map((r: any) => r[0])
            .filter((email: any) => {
                if (typeof email !== 'string') return false;
                const e = email.trim();
                const lower = e.toLowerCase();
                // Basic validation: must contain @ and not be the header "email"
                return lower !== 'email' && lower !== 'emails' && e.includes('@');
            })
            .map((e: string) => e.trim())
    ));
};
