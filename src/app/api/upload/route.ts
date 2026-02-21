import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (err) {
            // Ignore if directory exists
        }

        const fileName = `${uuidv4()}-${file.name}`;
        const filePath = join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${fileName}`;

        return NextResponse.json({ url: fileUrl });
    } catch (err: any) {
        console.error('Error uploading file:', err);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
