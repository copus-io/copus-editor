import styles from '../style.module.less';

export default function getEditorPortal(): HTMLElement {
  let mountPoint = document.getElementById('copus-editor-portal');
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 'copus-editor-portal';
    mountPoint.classList.add(styles['copus-editor-shell']);
    document.body.appendChild(mountPoint);
  }
  return mountPoint;
}
