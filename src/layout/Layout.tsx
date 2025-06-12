export default function Layout(props: any) {
  return (
    <main class="flex flex-col h-full w-full justify-center items-center overflow-hidden">
      {props.children}
    </main>
  );
}
