export default function getEditorPortal(): HTMLElement {
  let mountPoint = document.getElementById('s31-editor-portal');
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 's31-editor-portal';
    document.body.appendChild(mountPoint);
  }
  return mountPoint;
}
