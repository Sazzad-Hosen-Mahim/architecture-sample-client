export default function ProjectObjectivesCard() {
  const cards = [
    { title: "Assigned", value: 120, color: "text-orange-800" },
    { title: "Complete", value: 32, color: "text-pink-800" },
    { title: "In Progress", value: 15, color: "text-yellow-500" },
    { title: "Not Started", value: 4, color: "text-green-800" },
    { title: "Tasks", value: 69, color: "text-gray-700" },
  ];

  return (
    <div className="">
      {/* <h2 className="text-xl ml-4">Project Objectives : </h2> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-2  bg-gray-50">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow p-4 flex flex-col items-center justify-center hover:shadow-md transition"
          >
            <p className="text-gray-500 text-sm">{card.title}</p>
            <h2 className={`text-xl font-semibold mt-1 ${card.color}`}>
              {card.value}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}
