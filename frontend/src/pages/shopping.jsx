import { useState, useEffect } from "react"
import DatePicker from "react-datepicker"
import { ShoppingRow } from "../components/ShoppingRow"
import styles from '../styles/shopping.module.css'
import { Toast } from "../components/Toast"

export const Shopping = () => {
    const [weekStart, setWeekStart] = useState(Date())
    const [ingredientList, setIngredientList] = useState([])
    const [crossed, setCrossed] = useState([])
    const [notification, setNotification] = useState(null)

    const formatDateKey = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const getWeekRange = (date) => {
        const start = new Date(date)
        start.setDate(start.getDate() - start.getDay())
        const end = new Date(start)
        end.setDate(end.getDate() + 6)

        const options = {month: "short", day: "numeric", year: "numeric"}
        return `${start.toLocaleDateString('en-us', options)} - ${end.toLocaleDateString('en-us', options)}`
    }

    const getWeekStartEnd = (date) => {
        let start = new Date(date)
        start.setDate(start.getDate() - start.getDay())
        let end = new Date(start)
        end.setDate(end.getDate() + 6)
        start = formatDateKey(start)
        end = formatDateKey(end)
        return [start, end]
    }

    const handleDelete = (ingredient_id) => {
        setIngredientList(ingredientList.filter((ingredient) => (ingredient.id !== ingredient_id)))
    }

    const handleUpdate = (ingredient_id, field, new_val) => {
        const copyRows = ingredientList.map((ingredient) => (
            ingredient.id === ingredient_id ? {...ingredient, [field]: new_val} : ingredient
        ))
        setIngredientList(copyRows)
    }

    const handleUpdateCrossed = (ingredient_id) => {
        if (crossed.includes(ingredient_id)){
            const copyRows = crossed.filter((ing_id) => ing_id !== ingredient_id)
            setCrossed(copyRows)
        }else{
            setCrossed(prev => (
                [...prev, ingredient_id]
            ))
        }
    }


    useEffect(() => {
        const fetchIngredients = async () => {
            const [start, end] = getWeekStartEnd(weekStart)
            console.log("fetching ingredients")
            try{
                const response = await fetch(`http://localhost:8000/ingredients?start=${start}&end=${end}`, {
                    method: "GET",
                    credentials: "include"
                })

                if(!response.ok){
                    throw new Error("Error fetching ingredients")
                }
                const data = await response.json()
                console.log("ingredients data")
                console.log(data)
                let data_array = []
                Object.values(data).forEach((ingredient) => {
                    const existing = data_array.find((item) => item.name === ingredient["ingredient_name"])
                    if (existing){
                        existing.frequency += 1
                        existing.totalQty += ingredient["ingredient_quantity"]
                    }else{
                        data_array.push({
                            id: crypto.randomUUID(),
                            name: ingredient["ingredient_name"],
                            quantity: ingredient["ingredient_quantity"],
                            unit: ingredient["ingredient_unit"],
                            frequency: 1,
                            totalQty: ingredient["ingredient_quantity"]
                        })
                    }
                })
                setIngredientList(data_array)
                
            }catch(e){
                setNotification({message: e.message, type: "error"})
            }
        }

        fetchIngredients()
    }, [weekStart])

    return (
        <>
            <div className={styles.mainContainer}>
                <div className={styles.topLine}>
                    <span className={`${styles.weekLabel} ${styles.weekSelector}`}>Grocery ·</span> 
                    <DatePicker 
                        selected={weekStart}
                        onChange={(newDate) => setWeekStart(newDate)}
                        customInput={
                            <button className={styles.weekSelector}>
                                <span className={styles.weekLabel}>Week of </span> {getWeekRange(weekStart)}
                            </button>
                        }
                        calendarStartDay={0}
                    />
                </div>
                <div className={styles.ingredients}>
                    {ingredientList.length > 0 ? 
                    ingredientList.map((ingredient) => (
                        <ShoppingRow key={ingredient.id} ing_data={ingredient} isCrossed={crossed.includes(ingredient.id)} handleUpdate={handleUpdate} handleDelete={handleDelete} handleUpdateCrossed={handleUpdateCrossed}/>
                    ))
                    : `Nothing to shop for!`}
                </div>
            </div>
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </>
    )
}