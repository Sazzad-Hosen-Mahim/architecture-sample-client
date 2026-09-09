import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button";
import { IoMdArrowRoundBack } from "react-icons/io";

type BackbuttonProps = {
    /**
     * Where the button goes. Left off, it steps back through history as it
     * always has; given a path, it goes there instead — for the pages that are
     * reached from one particular place and should return to it rather than to
     * whatever happened to be open before.
     */
    to?: string;
    label?: string;
    /** Navigation state to hand the destination, when `to` is given. */
    state?: Record<string, unknown>;
};

const Backbutton = ({ to, label = "Back", state }: BackbuttonProps) => {
    const navigate = useNavigate();
    return (
        <Button onClick={() => (to ? navigate(to, { state }) : navigate(-1))} className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            <IoMdArrowRoundBack className="text-md mt-[2px]" />
            <span className="text-md">{label}</span>
        </Button>
    )
}

export default Backbutton