import { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';

const VideoPlayer = ({ movieId }) => {
    const [active, setActive] = useState(false);

    useEffect(() => { setActive(false); }, [movieId]);

    if (!movieId) return null;

    const iframeSrc = `https://vidlink.pro/movie/${movieId}?nextbutton=true`;

    return (
        <div className="relative w-full h-full">
            <iframe
                src={iframeSrc}
                allowFullScreen
                title="Movie Stream"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full"
                style={{ userSelect: 'none' }}
            />
            {!active && (
                <div
                    className="absolute inset-0 z-10"
                    onClick={() => setActive(true)}
                    onWheel={(e) => window.scrollBy({ top: e.deltaY, behavior: 'auto' })}
                    title="Click to interact with player"
                />
            )}
        </div>
    );
};


VideoPlayer.propTypes = {
    movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
};

export default memo(VideoPlayer);