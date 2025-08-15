export default function Card({children, title}) { 
    return <div className="max-w-4xl mx-auto mt-2 text-white space-y-6 bg-black shadow rounded-lg p-4">
        { title && <h2 className="text-2xl text-center font-semibold"> {title} </h2> }
        {children}
    </div>
};