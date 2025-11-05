// import CommonWrapper from "../common/CommonWrapper";
// import {
//   decrement,
//   increment,
//   reset,
// } from "@/store/Slices/counterSlice/counterSlice";
// import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import Hero from "@/components/homeComponent/Hero";

const Home = () => {
  // const count = useAppSelector((state) => state.counter.value);
  // const dispatch = useAppDispatch();

  return (
    // <CommonWrapper>
    <div className="h-screen bg-transparent">
      <Hero />
    </div>
    // </CommonWrapper>
  );
};

export default Home;
