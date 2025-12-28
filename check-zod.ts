import { z } from 'zod';

const schema = z.object({
    email: z.string().email(),
});

const result = schema.safeParse({ email: 'invalid' });

if (!result.success) {
    console.log('Error object:', result.error);
    console.log('Has issues prop:', 'issues' in result.error);
    // @ts-ignore
    console.log('Issues:', result.error.issues);
} else {
    console.log('Success');
}
