'use server';

import {z} from 'zod';
import postgres from 'postgres';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {signIn} from "@/app/auth";
import {AuthError} from "next-auth";

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: 'require',
});


const InvoiceBaseSchema = z.object({
    customerId: z.string({message: 'Please select a customer'}).min(1, 'Customer is required'),
    amount: z.coerce.number().positive('Amount must be greater than $0'),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
});

function normalizeAmount(amount: number) {
    return Math.round(amount * 100);
}

function todayISODate() {
    return new Date().toISOString().slice(0, 10);
}

function revalidateInvoices() {
    revalidatePath('/dashboard/invoices');
}

function redirectToInvoices() {
    redirect('/dashboard/invoices');
}


export async function createInvoice(prevState: State | undefined, formData: FormData): Promise<State> {
    const parsed = InvoiceBaseSchema.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!parsed.success) {
        return {
            errors: parsed.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    try {
        const {customerId, amount, status} = parsed.data;

        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId},
                    ${normalizeAmount(amount)},
                    ${status},
                    ${todayISODate()})
        `;

    } catch (error) {
        console.error(error);
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }

    revalidateInvoices();
    redirectToInvoices();
    return {message: null, errors: {}};
}

export async function updateInvoice(id: string, prevState: State | undefined, formData: FormData): Promise<State> {
    const parsed = InvoiceBaseSchema.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!parsed.success) {
        return {
            errors: parsed.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
        };
    }

    try {
        const {customerId, amount, status} = parsed.data;

        await sql`
            UPDATE invoices
            SET customer_id = ${customerId},
                amount      = ${normalizeAmount(amount)},
                status      = ${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        console.error(error);
        return {message: 'Database Error: Failed to Update Invoice.'};
    }

    revalidateInvoices();
    redirectToInvoices();
    return {message: null, errors: {}};
}

export async function deleteInvoice(id: string) {
    try {
        await sql`
            DELETE
            FROM invoices
            WHERE id = ${id}
        `;
    } catch (error) {
        console.error('Delete invoice failed:', error);
        throw new Error('Failed to delete invoice');
    }
    revalidateInvoices();
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}