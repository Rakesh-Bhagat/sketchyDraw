"use client"

import Canvas from "@/components/Canvas";
import SessionButton from "@/components/SessionButton";
import ToolBox from "@/components/ToolBox";

const StandAloneCanvas = () => {
    return (
        <div className="flex relative justify-center">
            <div className="absolute z-10 bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:bottom-auto sm:top-3 sm:w-auto sm:flex sm:justify-center"> 
                <ToolBox/>
            </div>
            <div className="z-12 flex absolute top-3 right-3">
                <SessionButton roomId="standalone" />
            </div>
            <div>
                <Canvas />
            </div>
        </div>
    )
}

export default StandAloneCanvas;