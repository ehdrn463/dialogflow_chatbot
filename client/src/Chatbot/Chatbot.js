import React, {useEffect} from 'react';
import Axios from 'axios';
import {useDispatch, useSelector } from 'react-redux';
import {saveMessage} from '../_actions/message_actions';
import Message from './Sections/Message';
import {List, Icon, Avatar} from 'antd';
import Card from './Sections/Card';



function Chatbot() {
    const dispatch= useDispatch() ;
    // redux extension으로 확인해보면 state -> message -> messages 확인 가능
    const messagesFromRedux = useSelector(state => state.message.messages);

    // 처음 홈페이지 들어왔을 때, 반겨주는 기능
    useEffect(() => {
        eventQuery('welcomeToMyWebsite')
    }, [])

    const textQuery = async(text) =>{
        // first need to take care of the message i sent')
        let conversation = {
            who: 'user',
            content: {
                // 아래처럼 넣어준 이유? -> text => text 안에 우리가 보낸 메시지가 있음
                // dialogflow에서 보내준 형식과 맞추기 위해.
                text:{
                    text: text
                }
            }
        }
        dispatch(saveMessage(conversation));

        // We need to take care of the messsage Chatbot sent
        const textQueryVariables = {
            text
        }
        try{
            // I will send request to the textQuery Route
            // dialogflow.js를 보면 async await 문법을 사용 중임 -> 똑같이 맞춰줌 (then.(response) 사용 X)
            const response = await Axios.post('/api/dialogflow/textQuery', textQueryVariables)
            // -> 이렇게하면 0번 인덱스 하나만 가져옴const content = response.data.fulfillmentMessages[0] // 기본적인 정보만 받을 것임.
            // 반복문으로 모든 메시지 받기
            for (let content of response.data.fulfillmentMessages){
                let conversation = {
                    who: 'bot',
                    content: content
                }
                dispatch(saveMessage(conversation));
            }


        }
        catch (error) {
            conversation = {
                who: 'bot',
                content: {
                    text:{
                        text: "Error occucred, check problems"
                    }
                }
            }
            dispatch(saveMessage(conversation));
        }
    }

    const eventQuery = async(event) =>{
        // We need to take care of the messsage Chatbot sent
        const eventQueryVariables = {
            event
        }
        try{
            // I will send request to the textQuery Route
            // dialogflow.js를 보면 async await 문법을 사용 중임 -> 똑같이 맞춰줌 (then.(response) 사용 X)
            const response = await Axios.post('/api/dialogflow/eventQuery', eventQueryVariables)
            for (let content of response.data.fulfillmentMessages){
                let conversation = {
                    who: 'bot',
                    content: content
                }
                dispatch(saveMessage(conversation));
            }
        }
        catch (error) {
            let conversation = {
                who: 'bot',
                content: {
                    text:{
                        text: "Error occucred, check problems"
                    }
                }
            }
            dispatch(saveMessage(conversation));
        }
    }

    const keyPressHanlder = (e) =>{
        if(e.key === "Enter"){
            if (!e.target.value){
                return alert('you need to type something first')
            }
            // We will send request to text query route
            textQuery(e.target.value)
            e.target.value ="";
        }
    }

    const renderCards = (cards) =>{
        return cards.map((card, i) => <Card key={i} cardInfo={card.structValue}/>)
    }

    const renderOneMessage = (message, i) => {
        console.log('message', message)

        // we need to give some condition here to separate message kinds 

        // template for normal text 
        if (message.content && message.content.text && message.content.text.text) {
            return <Message key={i} who={message.who} text={message.content.text.text} />
        } else if (message.content && message.content.payload.fields.card) {

            const AvatarSrc = message.who === 'bot' ? <Icon type="robot" /> : <Icon type="smile" />

            return <div>
                <List.Item style={{ padding: '1rem' }}>
                    <List.Item.Meta
                        avatar={<Avatar icon={AvatarSrc} />}
                        title={message.who}
                        description={renderCards(message.content.payload.fields.card.listValue.values)}
                    />
                </List.Item>
            </div>
        }

        //template for noraml text
        // 
        // template for card message
        
    }

    const renderMessage = (returnMessages) =>{
        if(returnMessages){
            return returnMessages.map((message, i) =>{
                return renderOneMessage(message,i);
            })
        } else{
            return null;
        }
    }

    return (
        <div style={{
            height: 700, width: 700,
            border: '3px solid black', borderRadius: '7px'
        }}>
            <div style={{ height: 644, width: '100%', overflow: 'auto' }}>


                {renderMessage(messagesFromRedux)}


            </div>
            <input
                style={{
                    margin: 0, width: '100%', height: 50,
                    borderRadius: '4px', padding: '5px', fontSize: '1rem'
                }}
                placeholder="Send a message..."
                onKeyPress={keyPressHanlder}
                type="text"
            />

        </div>
    );
}


export default Chatbot;