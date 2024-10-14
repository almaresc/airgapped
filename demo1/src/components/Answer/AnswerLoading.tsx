import { Stack } from "@fluentui/react";
import { animated, useSpring } from "@react-spring/web";
import styles from "./Answer.module.css";
interface Props {
    text: string;
    icon: string;
}


export const AnswerLoading = ({text, icon}: Props) => {

    const animatedStyles = useSpring({
        from: { opacity: 0 },
        to: { opacity: 1 }
    });

   /* if (query == null) {*/
        return (

            <animated.div style={{ ...animatedStyles }}>
                <Stack className={styles.answerContainer} verticalAlign="space-between">

                    <Stack.Item grow>
                        <div>
                            <span className={styles.imgSpan}><img src={icon} className={styles.img} /></span>
                            <span className={styles.answerText}>{text}</span>
                        </div>
                    </Stack.Item>
                </Stack>
            </animated.div>
        );
    //}
    //else {
    //    return (

    //        <animated.div style={{ ...animatedStyles }}>
    //            <Stack className={styles.answerContainer} verticalAlign="space-between">

    //                <Stack.Item grow>
    //                    <div>
    //                        <span className={styles.imgSpan}><img src={icon} className={styles.img} /></span>
    //                        <span className={styles.answerText}>Sto Cercando: {query} ..</span>
    //                    </div>
    //                </Stack.Item>
    //            </Stack>
    //        </animated.div>
    //    );
    //}
};
