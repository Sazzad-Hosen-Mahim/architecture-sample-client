import { ProjectManagementTab } from "@/components/Deshboard/ProjectManagementTab";
import ProjectObjectivesCard from "@/components/Deshboard/ProjectObjectivesCard";
import TotalProjectsFirm from "@/components/Deshboard/TotalProjectsFirm";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

export default function Dashboard() {
  const user = useAppSelector(selectCurrentUser);
  console.log("Logged in  mmmmmm:", user);

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
