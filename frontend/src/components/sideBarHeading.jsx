import styles from '../styles/sideBarHeading.module.css'
export const SideBarHeading = ({ eyebrow, title }) => {
    return (
        <div class={styles.header}>
            <div class={styles.eyebrow}>{eyebrow}</div>
            <div class={styles.title}>{title}</div>
        </div>
    )
}