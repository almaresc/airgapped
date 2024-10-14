import styles from "./UserChatMessage.module.css";

interface Props {
    message: string;
}

export const UserChatMessage = ({ message }: Props) => {
    return (
        <div className={styles.container}>  
                <span className={styles.answerText}>{message}</span> 
                <span className={styles.imgSpan}><img src="user.jpg" className={styles.img} /></span>
               
        </div>
    );
};
