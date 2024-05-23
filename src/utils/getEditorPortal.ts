import styles from '../style.module.less';

export default function getEditorPortal(): HTMLElement {
  let mountPoint = document.getElementById('s31-editor-portal');
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 's31-editor-portal';
    mountPoint.classList.add(styles['s31-editor-shell']);
    document.body.appendChild(mountPoint);
  }
  return mountPoint;
}
