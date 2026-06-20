import {z} from 'zod';

export const updateUserSchema = z.object({
    first_name: z.string().min(1).max(50).optional(),
    last_name: z.string().min(1).max(50).optional(),
    year_of_study: z.number().int().min(1).max(6).optional(),
});

export const registerSchema = z.object({
    first_name: z.string().min(1).max(50),
    last_name: z.string().min(1).max(50),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    username: z.string().min(3).max(30),
    year_of_study: z.number().int().min(1).max(6),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

