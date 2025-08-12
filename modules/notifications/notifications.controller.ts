import { Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationEntity } from './entity/notification.entity';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationService : NotificationsService){}

    @Get()
    async getAll(@Request() req): Promise<NotificationEntity[]> {
        return await this.notificationService.getAll(req.user.id);
    }

    @Post('read-all')
    async readAll(@Request() req) : Promise<void>{
        return this.notificationService.readAll(req.user.id);
    }

    @Patch(':id')
    async update(@Param('id') id : number) : Promise<void>{
        return this.notificationService.update(+id);
    }

    @Delete(':id')
    async delete(@Param('id') id : number) : Promise<void>{
        return this.notificationService.delete(id)
    }
}
