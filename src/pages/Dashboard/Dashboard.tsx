import { ProjectManagementTab } from "@/components/Deshboard/ProjectManagementTab";
import ProjectObjectivesCard from "@/components/Deshboard/ProjectObjectivesCard";
import TotalProjectsFirm from "@/components/Deshboard/TotalProjectsFirm";

export default function Dashboard() {
  return (
    <div>
      <div className=" px-4 py-4 bg-[#f9fafb]">
        {" "}
        <TotalProjectsFirm />
        <ProjectObjectivesCard />
        {/* table for project management  */}
        <ProjectManagementTab />
      </div>
    </div>
  );
}
