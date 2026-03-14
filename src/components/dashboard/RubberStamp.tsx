import { cn } from "@/lib/utils";

interface RubberStampProps {
  text: string;
  className?: string;
}

const RubberStamp = ({ text, className }: RubberStampProps) => {
  return (
    <div className={cn("rubber-stamp", className)}>
      {text}
    </div>
  );
};

export default RubberStamp;
