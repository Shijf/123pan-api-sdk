import { sleep } from "@123pan/core";
import * as fs from 'fs';
import sdk from "../core/index";

const foldid = "ymjew503t0m000d7w32y39m71342qaovDIYxAwJ1AqFvAGxPBIiOBF==";
// sdk.image.upload.createFolder({
//     name: ['test'],
//     type: 1
// }).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// });


// sdk.image.copy.createCopyTask({
//     fileIDs: ['22882455'],
//     toParentFileID: foldid,
//     sourceType: '1',
//     type: 1
// }).then(async res => {
//     console.log(res);
//     const taskID = res.data.taskID;
//     // await sleep(20000);
//     sdk.image.copy.getCopyTaskProcess({
//         taskID: taskID
//     }).then(res => {
//         console.log(res);
//     }).catch(err => {
//         console.error(err);
//     });
//     sdk.image.copy.getCopyFailFiles({
//         taskID: taskID,
//         limit: 100,
//         page: 1
//     }).then(res => {
//         console.log(res);
//     }).catch(err => {
//         console.error(err);
//     });
// }).catch(err => {
//     console.error(err);
// });


// sdk.image.move.moveFiles({
//     fileIDs: ['ymjew503t0m000d7w32y2dg5rpyoquxlDIYxAwJ1AqFvAGxPBIiOBF=='],
//     toParentFileID: foldid
// }).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// });

// sdk.image.delete.deleteFiles({
//     fileIDs: ['yk6baz03t0l000d7w33g320kotq1q038DIYxAwJ1AqFvAGxPBIiOBF==']
// }).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// });


// sdk.image.info.getImageList({
//     parentFileId: foldid,
//     limit: 100,
//     type: 1
// }).then(res => {
//     console.log(JSON.stringify(res.data.fileList));
// }).catch(err => {
//     console.error(err);
// });


// sdk.image.info.getImageDetail({
//     fileID: 'ymjew503t0m000d7w32y2dg5rpyoquxlDIYxAwJ1AqFvAGxPBIiOBF=='
// }).then(res => {
//     console.log(JSON.stringify(res.data));
// }).catch(err => {
//     console.error(err);
// });

// sdk.image.view.getImageUrl({
//     fileID: 'ymjew503t0m000d7w32y2dg5rpyoquxlDIYxAwJ1AqFvAGxPBIiOBF==',
// }).then(res => {
//     console.log(res.url);
//     console.log(res.originalUrl);
// }).catch(err => {
//     console.error(err);
// });


// sdk.image.upload.uploadFile({
//     filename: 'test2.jpg',
//     file: fs.readFileSync('./asserts/test2.jpg'),
//     parentFileID: foldid
// }).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// });


