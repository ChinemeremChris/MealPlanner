import styles from '../styles/userCard.module.css'
export const UserCard = ({fname, lname, recipe_count}) => {
    return (
        <div>
            <div className={`${styles.card}`}>
                <div className={`${styles.avatar} ${styles.avatarLG}`}>{fname?.[0] && lname?.[0] ? `${fname[0]}${lname[0]}`: `JD`}</div>
                <div className={styles.userName}>{fname || lname ? `${fname} ${lname}`.trim() : 'John Doe'}</div>
                <div className={styles.divider}></div>
                <div className={styles.recipeCount}><span>{recipe_count}</span> recipes</div>
            </div>
        </div>
    )
}