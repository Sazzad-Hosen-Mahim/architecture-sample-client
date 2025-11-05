export default function TotalProjectsFirm() {
  const cards = [
    { title: "Total", value: 120, color: "text-gray-800" },
    { title: "Inquiry", value: 32, color: "text-blue-600" },
    { title: "Bidding", value: 15, color: "text-yellow-500" },
    { title: "Active", value: 4, color: "text-green-600" },
    { title: "Done", value: 69, color: "text-gray-700" },
  ];

  return (
    <div className="">
      {/* <h2 className="text-xl ml-4">Project Objectives ff : </h2> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-1 bg-gray-50">
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
