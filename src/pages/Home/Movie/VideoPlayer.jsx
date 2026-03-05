import { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';

const VideoPlayer = ({ movieId }) => {
    const [active, setActive] = useState(false);

    useEffect(() => { setActive(false); }, [movieId]);

    if (!movieId) return null;

    const iframeSrc = `https://vidlink.pro/movie/${movieId}?nextbutton=true&autoplay=true&muted=false`;

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
        </div>
    );
};


VideoPlayer.propTypes = {
    movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
};

export default memo(VideoPlayer);