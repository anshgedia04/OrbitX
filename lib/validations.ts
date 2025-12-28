import { z } from 'zod';

export const SignUpSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const FolderSchema = z.object({
    name: z.string().min(1, "Folder name is required").max(50, "Folder name too long"),
    parentFolder: z.string().optional().nullable(),
    color: z.string().optional(),
    icon: z.string().optional(),
});

export const NoteSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title too long"),
    content: z.string().optional(),
    type: z.enum(["text", "markdown", "code"]).optional(),
    folder: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    isFavorite: z.boolean().optional(),
    language: z.string().optional(),
});

export const TagSchema = z.object({
    name: z.string().min(1, "Tag name is required").max(30, "Tag name too long"),
    color: z.string().optional(),
});
