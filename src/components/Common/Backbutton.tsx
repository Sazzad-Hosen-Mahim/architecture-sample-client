import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button";
import { IoMdArrowRoundBack } from "react-icons/io";

const Backbutton = () => {
    const navigate = useNavigate();
    return (
        <Button onClick={() => navigate(-1)} className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            <IoMdArrowRoundBack className="text-md mt-[2px]" />
            <span className="text-md">Back</span>
        </Button>
    )
}

export default Backbutton