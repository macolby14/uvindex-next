import { useState } from "react";

export function EditableText({
  initialText,
  onTextChange,
}: {
  initialText: string;
  onTextChange: (text: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialText);

  const handleFinishEditing = () => {
    setIsEditing(false);
    onTextChange(text);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      handleFinishEditing();
    }
  };

  const handleInputBlur = () => {
    handleFinishEditing();
  };

  return (
    <div
      className="flex items-center space-x-2 cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      <div onKeyDown={handleKeyDown} tabIndex={0} className="relative w-full">
        {isEditing ? (
          <input
            type="text"
            value={text}
            onBlur={handleInputBlur}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            className="w-fit-content px-2 py-1 border rounded"
          />
        ) : (
          <p className="w-fit-content">{text}</p>
        )}
      </div>
      {/*eslint-disable-next-line @next/next/no-img-element*/}
      <img src="/pencil.svg" width="12px" height="12px" alt="Edit icon" />
    </div>
  );
}
