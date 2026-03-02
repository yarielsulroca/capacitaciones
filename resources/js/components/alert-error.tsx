import { Alert } from 'antd';

export default function AlertError({
    errors,
    title,
}: {
    errors: string[];
    title?: string;
}) {
    return (
        <Alert
            type="error"
            showIcon
            message={title || 'Something went wrong.'}
            description={
                <ul className="list-inside list-disc text-sm mt-1">
                    {Array.from(new Set(errors)).map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
            }
        />
    );
}
