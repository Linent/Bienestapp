import { Response } from "express";


export const handlerError = (res, status, message) =>{
    res.status(status).json({ message })
}