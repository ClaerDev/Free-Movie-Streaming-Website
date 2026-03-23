import { memo } from 'react';
import PropTypes from 'prop-types';

const VideoPlayer = ({ tvId, season = 1, episode = 1 }) => {
    const iframeSrc = `https://vidlink.pro/tv/${tvId}/${season}/${episode}?primaryColor=c45454&secondaryColor=a2a2a2&iconColor=eefdec&poster=true&title=true&nextbutton=false&player=jw`;
    return (
        <div className="relative w-full h-full">
            <iframe
                src={iframeSrc}
                title={`TV Show: ${tvId} - S${season}E${episode}`}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media;"
                allowFullScreen
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                referrerPolicy="no-referrer"
            />
        </div>
    );
}

VideoPlayer.propTypes = {
    tvId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    season: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    episode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default memo(VideoPlayer);