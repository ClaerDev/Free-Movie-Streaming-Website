import React, { memo } from 'react'; // Removed useEffect, useRef
import PropTypes from 'prop-types';

const VideoPlayer = ({ tvId, season = 1, episode = 1 }) => {
    // Construct the iframe source URL using the Vidsrc.pk format
    const iframeSrc = `https://vidlink.pro/tv/${tvId}/${season}/${episode}?nextbutton=true`;

 
   

    return (
        <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
            <iframe
                // No ref needed anymore as we removed the JS interacting with it
                src={iframeSrc}
                title={`TV Show: ${tvId} - S${season}E${episode}`}
                className="absolute top-0 left-0 w-full h-full border-0"
                // --- Apply Sandbox ---
                // --- Permissions Policy ---
                // 'allow' attribute works alongside 'sandbox' to grant specific browser features.
                allow="autoplay; fullscreen; picture-in-picture"
                // allowFullScreen is legacy but often included for broader compatibility
                allowFullScreen
                loading="lazy" // Defer loading until needed
                referrerPolicy="no-referrer" // Don't send referrer info
                // style={{ userSelect: 'none' }} // Optional: consider if needed
            />
             {/* Optional decorative overlay - kept from original */}
             <div className="absolute top-0 left-0 w-full h-full border-0 rounded shadow-lg pointer-events-none" style={{zIndex: 1}}></div>
        </div>
    );
}

VideoPlayer.propTypes = {
    tvId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    season: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    episode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default memo(VideoPlayer);