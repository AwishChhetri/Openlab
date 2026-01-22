export const stripHtml = (html: string) =>
    (html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

export const truncate = (text: string, len = 120) =>
    text.length > len ? text.slice(0, len) + '…' : text;
