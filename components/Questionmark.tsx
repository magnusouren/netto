import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { CircleQuestionMark } from 'lucide-react';

interface QuestionmarkProps {
    helptext: string;
}

export function Questionmark({ helptext }: QuestionmarkProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <CircleQuestionMark className='w-4 h-4 m-0 p-0 inline cursor-help' />
            </TooltipTrigger>
            <TooltipContent>
                <p>{helptext}</p>
            </TooltipContent>
        </Tooltip>
    );
}
