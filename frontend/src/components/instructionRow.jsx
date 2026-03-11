import { X } from 'lucide-react'
import '../styles/inputRows.css'

export const InstructionRow = ({ instruction, updateInstruction, deleteInstruction }) => {
    return(
        <>
            <textarea className='instructionText' value={instruction.instruction} onChange={(e) => (updateInstruction(instruction.id, "instruction", e.target.value))}></textarea>
            <button type="button" className="deleteInstructRow" onClick={() => (deleteInstruction(instruction.id))}><X/></button>
        </>
    )
}