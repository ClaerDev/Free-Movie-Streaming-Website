import { useState, useEffect } from 'react'
import ParentComponent from './ParentComponent'

function Home() {
  const [currentPage, setCurrentPage] = useState('home')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1)
    return () => clearTimeout(timer)
  }, [currentPage])



  return (
          <main className="w-full min-h-screen px-2 sm:px-4 pt-20 sm:pt-24 bg-black">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-red-500"></div>
                </div>
              ) : (
                  <div className="transition-transform duration-100 ease-out mt-4 sm:mt-6">
                    <ParentComponent />
                  </div>
              )}
          </main>

  )
}

export default Home
