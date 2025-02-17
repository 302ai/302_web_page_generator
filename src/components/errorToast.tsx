import { Trans } from "react-i18next";
import { selectGlobal } from "../store/globalSlice";
import { useAppSelector } from "../store/hooks";

const region = import.meta.env.VITE_APP_REGION;

export function ErrorToast(props: { code: number }) {
    const errorCodes = [-10001, -10002, -10003, -10004, -10005, -10006, -10007, -10008, -10009, -10010, -10011, -10012, -10018, -1024, -101, -100, -99];
    const errorCode = errorCodes.includes(props.code) ? props.code : '-default';

    const handleClick = () => {
        const url = region === 0
            ? import.meta.env.VITE_APP_302_WEBSITE_URL_CHINA
            : import.meta.env.VITE_APP_302_WEBSITE_URL_GLOBAL;
        window.location.href = url || 'https://302.ai/';
    };

    return (
        <div>
            <Trans i18nKey={`global.error.code${errorCode}`} components={{
                Gw:
                    <span style={{ color: '#006dff', cursor: 'pointer' }} onClick={handleClick}>
                        302.AI
                    </span>
            }}>
            </Trans>
        </div>
    );
}
