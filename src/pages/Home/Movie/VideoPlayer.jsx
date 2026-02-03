import { useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';

const VideoPlayer = ({ movieId }) => {
    const iframeRef = useRef(null);

    useEffect(() => {
       

        const currentIframe = iframeRef.current;

        const disableContextMenu = (event) => event.preventDefault();

        const handleClickEvent = (event) => {
            if (currentIframe?.contains(event.target)) {
                event.stopPropagation();
            }
        };


        window.addEventListener('contextmenu', disableContextMenu);
        document.addEventListener('click', handleClickEvent, true);


        return () => {
            window.removeEventListener('contextmenu', disableContextMenu);
            document.removeEventListener('click', handleClickEvent, true);
        };
    }, []);

    if (!movieId) return null;

    const iframeSrc = ` https://vidlink.pro/movie/${movieId}?nextbutton=true`;

    return (
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <iframe
                ref={iframeRef}
                src={iframeSrc}
                allowFullScreen
                title="Series Stream"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="absolute top-0 left-0   w-full h-[50vh] sm:h-[30vh] md:h-[60vh] lg:h-[70vh] xl:h-[80vh] rounded shadow-lg mb-3"
                style={{
                    pointerEvents: 'auto',
                    userSelect: 'none',
                }}
                
            />
        </div>
    );
};


VideoPlayer.propTypes = {
    movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default memo(VideoPlayer);