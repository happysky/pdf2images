const home = async (req, res)=>{
    
    const data = {
        "now": Date.now()
    }

    res.render('home', {data: JSON.stringify(data)})
}

export default home;