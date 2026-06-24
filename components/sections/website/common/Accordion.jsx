'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const AccordionItem = ({ question, answer, isOpen, onClick, className }) => {
  return (
    <motion.div
      className={cn(
        "bg-[#F8F8F808] backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden",
        className
      )}
      initial={false}

      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-700/30 transition-colors duration-200 cursor-pointer"
        onClick={onClick}
      >
        <span className="text-white font-medium text-base leading-relaxed pr-4">
          {question}
        </span>
        <motion.div
          className="flex-shrink-0"
          animate={{ rotate: isOpen ? 0 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="minus"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Minus className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="plus"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.04, 0.62, 0.23, 0.98],
              opacity: { duration: 0.3, delay: 0.1 }
            }}
            className="overflow-hidden"
          >
             <motion.div
               className="px-6 pb-4"
               initial={{ y: -10 }}
               animate={{ y: 0 }}
               exit={{ y: -10 }}
               transition={{ duration: 0.3, delay: 0.1 }}
             >
               {typeof answer === 'string' ? (
                 <p className="text-gray-300 text-sm leading-relaxed">
                   {answer}
                 </p>
               ) : (
                 <div className="text-gray-300 text-sm leading-relaxed">
                   {answer}
                 </div>
               )}
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const Accordion = ({ items, className, allowMultiple = false }) => {
  const [openItems, setOpenItems] = useState(new Set())

  const toggleItem = (index) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        if (!allowMultiple) {
          newSet.clear()
        }
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <div className={cn("flex flex-col w-full gap-5 max-w-5xl h-full", className)}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: index * 0.05, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          viewport={{ once: false, margin: "-50px" }}
          style={{ willChange: 'transform, opacity' }}
        >
          <AccordionItem
            question={item.question}
            answer={item.answer}
            isOpen={openItems.has(index)}
            onClick={() => toggleItem(index)}
          />
        </motion.div>
      ))}
    </div>
  )
}

export default Accordion
