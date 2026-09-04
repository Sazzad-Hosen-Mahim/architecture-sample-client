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
    // Passes the layout's leftover height straight through to the hero.
    <div className="flex flex-1 flex-col bg-transparent">
      <Hero />
    </div>
    // </CommonWrapper>
  );
};

export default Home;
