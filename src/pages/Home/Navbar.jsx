import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Search from './Search';

function Navbar() {
  const [activeElement, setActiveElement] = useState('search');
  const [searchValue, setSearchValue] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const navigationRefs = useRef({});
  const containerRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (isModalOpen) return;
      const currentIndex = ['search'].findIndex((el) => el === activeElement);
      const handleNavigation = {
        ArrowRight: () => {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % 3; // Only 3 elements now
          const nextElement = ['search'][nextIndex];
          setActiveElement(nextElement);
          navigationRefs.current[nextElement]?.focus();
        },
        ArrowLeft: () => {
          e.preventDefault();
          const prevIndex = currentIndex === 0 ? 2 : currentIndex - 1;
          const prevElement = ['search'][prevIndex];
          setActiveElement(prevElement);
          navigationRefs.current[prevElement]?.focus();
        },
        Enter: () => {
          e.preventDefault();
          const currentElement = ['search'][currentIndex];
          if (currentElement === 'search') {
            setIsSearchActive(true);
            navigationRefs.current.search?.focus();
          } 

        },
        Escape: () => {
          if (isSearchActive) {
            setIsSearchActive(false);
            setSearchValue('');
            setActiveElement('search');
            navigationRefs.current.search?.focus();
          }
        }
      };
      handleNavigation[e.key]?.();
    },
    [activeElement, isSearchActive]
  );

  
  const setRef = useCallback(
    (id) => (el) => {
      navigationRefs.current[id] = el;
    },
    []
  );

  const handleSearchFocus = useCallback(() => {
    setActiveElement('search');
    setIsSearchActive(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    if (!isSearchActive) setActiveElement('search');
  }, [isSearchActive]);

  
  return (
    <div
      className="fixed w-full z-50"
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <Search
        ref={setRef('search')}
        isActive={activeElement === 'search'}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
    </div>
  );
}

Navbar.propTypes = {
  onNavigate: PropTypes.func.isRequired
};

export default React.memo(Navbar);