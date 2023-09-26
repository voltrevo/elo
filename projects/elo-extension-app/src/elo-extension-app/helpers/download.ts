export default function download(
  filename: string,
  contentType: string,
  data: string,
) {
  const button = document.createElement('a');
  button.download = filename;

  const blob = new Blob([data], { type: contentType });
  button.href = URL.createObjectURL(blob);

  button.click();

  URL.revokeObjectURL(button.href);

  button.remove();
}
