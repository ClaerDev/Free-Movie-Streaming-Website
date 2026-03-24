import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';

export default function CastRow({ cast }) {
  const navigate = useNavigate();
  const listRef = useRef(null);
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const el = listRef.current;
    if (!el) return;
    dragStateRef.current = {
      active: true,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e) => {
    const el = listRef.current;
    const drag = dragStateRef.current;
    if (!el || !drag.active) return;
    const delta = e.pageX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    el.scrollLeft = drag.startScrollLeft - delta;
  }, []);

  const endDrag = useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag.active) return;
    drag.active = false;
    suppressClickRef.current = drag.moved;
    setIsDragging(false);
    setTimeout(() => { suppressClickRef.current = false; }, 0);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', endDrag);
    return () => window.removeEventListener('mouseup', endDrag);
  }, [endDrag]);

  if (!cast || cast.length === 0) return null;

  // Render top 20 cast members
  const topCast = cast.slice(0, 20);

  return (
    <section className="px-4 sm:px-6 md:px-12 pb-16">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
          <span className="w-1.5 h-6 bg-red-500 rounded-full inline-block"></span>
          Top Cast
        </h3>
        
        <div
          ref={listRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseLeave={endDrag}
          className={`flex gap-4 md:gap-5 overflow-x-auto hide-scrollbar px-4 pt-6 pb-6 -mx-4 -mt-6 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {topCast.map((person) => {
            const slug = person.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <div 
                key={person.credit_id || person.id} 
                className="shrink-0 w-[120px] md:w-[140px] transition-transform duration-300 hover:-translate-y-2 group"
                onClick={() => {
                  if (suppressClickRef.current) return;
                  navigate(`/person/${person.id}/${slug}`);
                }}
              >
                <div className="w-full aspect-[2/3] bg-[#111827] rounded-xl overflow-hidden ring-1 ring-white/5 group-hover:ring-white/20 group-hover:shadow-xl transition-all duration-300 relative mb-3">
                  {person.profile_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w276_and_h350_face${person.profile_path}`} 
                      alt={person.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0d1117] text-gray-700">
                      <FaUser className="text-4xl opacity-50" />
                    </div>
                  )}
                  {/* Overlay shadow for nice gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {/* Person details */}
                <h4 className="text-white text-[13px] font-bold leading-tight line-clamp-1 group-hover:text-red-400 transition-colors">
                  {person.name}
                </h4>
                <p className="text-gray-500 text-[11px] mt-1 leading-snug line-clamp-2">
                  {person.character}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
