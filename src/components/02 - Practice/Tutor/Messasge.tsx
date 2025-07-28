import TextDisplayArea from "@/components/01 - Home/Notes/NoteArea";

interface MessageProps {
  text: string;
  user: boolean;
  id: number;
}

export default function Message(props: MessageProps) {
  return (
    <div
      class={`flex ${props.user ? `justify-end` : `justify-start`} my-2 mx-6 w-full`}
    >
      <TextDisplayArea
        class={`max-w-[80%] hyphens-auto px-4 rounded-lg text-lg break-words ${
          props.user ? `bg-gray-800 text-white` : `border-1 border-gray-600 bg-gray-900 text-text/90`
        } `}
        text={props.text}
      />
    </div>
  );
}