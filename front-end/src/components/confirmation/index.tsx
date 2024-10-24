import React from 'react'
import { Modal, Button } from "react-bootstrap";
import { AppButton } from '..';

const Confirmation = ({ showModal, hideModal, confirmModal, message}: any) => {
    return (
        <Modal show={showModal} onHide={hideModal}>
            <Modal.Header closeButton>
                <Modal.Title>{'Confirm'}</Modal.Title>
            </Modal.Header>
            <Modal.Body><div className="d-flex" style={{fontWeight:500, opacity:0.8}}>{message}</div></Modal.Body>
            <Modal.Footer>
                <AppButton bg='secondary' size='small' title='Cancel' onClick={hideModal}/>
                <AppButton bg='danger'   size='small' title='Delete' onClick={() => confirmModal()}/>
            </Modal.Footer>
        </Modal>
    )
}

export default Confirmation